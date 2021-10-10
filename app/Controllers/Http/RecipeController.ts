import Recipe from "App/Models/Recipe";
import Drive from "@ioc:Adonis/Core/Drive";
import Application from "@ioc:Adonis/Core/Application";
import { rules, schema } from "@ioc:Adonis/Core/Validator";
import Env from "@ioc:Adonis/Core/Env";

import fetch from "node-fetch";
import targz from "targz";
import path from "path";
import fs from "fs-extra";

const compress = (src, dest) =>
  new Promise((resolve, reject) => {
    targz.compress(
      {
        src,
        dest,
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(dest);
        }
      },
    );
  });

class RecipeController {
  // List official and custom recipes
  public async list({ response }) {
    const officialRecipes = JSON.parse(
      await (await fetch("https://api.franzinfra.com/v1/recipes")).text(),
    );
    const customRecipesArray = await Recipe.all();
    const customRecipes = customRecipesArray.map((recipe) => ({
      id: recipe.recipeId,
      name: recipe.name,
      ...(typeof recipe.data === "string" ? JSON.parse(recipe.data) : recipe.data),
    }));

    const recipes = [...officialRecipes, ...customRecipes];

    return response.send(recipes);
  }

  // Create a new recipe using the new.html page
  public async create({ request, response }) {
    // Check if recipe creation is enabled
    if (Env.get("IS_CREATION_ENABLED") === "false") {
      return response.send("This server doesn't allow the creation of new recipes.");
    }

    // Validate user input
    const recipeSchema = schema.create({
      name: schema.string(),
      id: schema.string({}, [rules.unique({ table: "recipes", column: "recipeId" })]),
      author: schema.string(),
      svg: schema.string({}, [rules.url()]),
    });

    try {
      await request.validate({
        schema: recipeSchema,
      });
    } catch (error) {
      return response.badRequest(error.messages);
    }

    const data = request.all();

    if (!data.id) {
      return response.send("Please provide an ID");
    }

    // Check for invalid characters
    if (/\.{1,}/.test(data.id) || /\/{1,}/.test(data.id)) {
      return response.send('Invalid recipe name. Your recipe name may not contain "." or "/"');
    }

    // Clear temporary recipe folder
    await fs.emptyDir(Application.tmpPath("recipe"));

    // Move uploaded files to temporary path
    const files = request.file("files");
    await files.moveAll(Application.tmpPath("recipe"));

    // Compress files to .tar.gz file
    const source = Application.tmpPath("recipe");
    const destination = path.join(Application.appRoot, `/recipes/${data.id}.tar.gz`);

    compress(source, destination);

    // Create recipe in db
    await Recipe.create({
      name: data.name,
      recipeId: data.id,
      data: JSON.stringify({
        author: data.author,
        featured: false,
        version: "1.0.0",
        icons: {
          svg: data.svg,
        },
      }),
    });

    return response.send("Created new recipe");
  }

  // Search official and custom recipes
  public async search({ request, response }) {
    // Validate user input
    const recipeSchema = schema.create({
      needle: schema.string(),
    });

    try {
      await request.validate({
        schema: recipeSchema,
      });
    } catch (error) {
      return response.badRequest(error.messages);
    }

    const needle = request.input("needle");

    // Get results
    let results: any[];

    if (needle === "ferdi:custom") {
      const dbResults = await Recipe.all();
      results = dbResults.map((recipe) => ({
        id: recipe.recipeId,
        name: recipe.name,
        ...(typeof recipe.data === "string" ? JSON.parse(recipe.data) : recipe.data),
      }));
    } else {
      let remoteResults = [];
      if (Env.get("CONNECT_WITH_FRANZ") === "true") {
        remoteResults = JSON.parse(
          await (
            await fetch(
              `https://api.franzinfra.com/v1/recipes/search?needle=${encodeURIComponent(needle)}`,
            )
          ).text(),
        );
      }

      const localResultsArray = await Recipe.query().where("name", "LIKE", `%${needle}%`);
      const localResults = localResultsArray.map((recipe) => ({
        id: recipe.recipeId,
        name: recipe.name,
        ...(typeof recipe.data === "string" ? JSON.parse(recipe.data) : recipe.data),
      }));

      results = [...localResults, ...(remoteResults || [])];
    }

    return response.send(results);
  }

  // Download a recipe
  public async download({ request, response, params }) {
    // Validate user input
    const recipeSchema = schema.create({
      recipe: schema.string(),
    });

    try {
      await request.validate({
        schema: recipeSchema,
      });
    } catch (error) {
      return response.badRequest(error.messages);
    }

    const service = params.recipe;

    // Check for invalid characters
    if (/\.{1,}/.test(service) || /\/{1,}/.test(service)) {
      return response.send("Invalid recipe name");
    }

    // Check if recipe exists in recipes folder
    if (await Drive.exists(`${service}.tar.gz`)) {
      return response.send(await Drive.get(`${service}.tar.gz`));
    }
    if (Env.get("CONNECT_WITH_FRANZ") === "true") {
      // eslint-disable-line eqeqeq
      return response.redirect(`https://api.franzinfra.com/v1/recipes/download/${service}`);
    }
    return response.status(400).send({
      message: "Recipe not found",
      code: "recipe-not-found",
    });
  }
}

module.exports = RecipeController;
