import Service from "App/Models/Service";
import { schema } from "@ioc:Adonis/Core/Validator";
import Env from "@ioc:Adonis/Core/Env";
import Application from "@ioc:Adonis/Core/Application";

import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs-extra";

class ServiceController {
  // Create a new service for user
  public async create({ request, response, auth }) {
    try {
      await auth.getUser();
    } catch (error) {
      return response.send("Missing or invalid api token");
    }

    // Validate user input
    const serviceSchema = schema.create({
      name: schema.string(),
      recipeId: schema.string(),
    });
    try {
      await request.validate({
        schema: serviceSchema,
      });
    } catch (error) {
      return response.badRequest(error.messages);
    }

    const data = request.all();

    // Get new, unused uuid
    let serviceId: string;
    do {
      serviceId = uuid();
    } while ((await Service.query().where("serviceId", serviceId)).length > 0); // eslint-disable-line no-await-in-loop

    await Service.create({
      userId: auth.user.id,
      serviceId,
      name: data.name,
      recipeId: data.recipeId,
      settings: JSON.stringify(data),
    });

    return response.send({
      data: {
        userId: auth.user.id,
        id: serviceId,
        isEnabled: true,
        isNotificationEnabled: true,
        isBadgeEnabled: true,
        isMuted: false,
        isDarkModeEnabled: "",
        spellcheckerLanguage: "",
        order: 1,
        customRecipe: false,
        hasCustomIcon: false,
        workspaces: [],
        iconUrl: null,
        ...data,
      },
      status: ["created"],
    });
  }

  // List all services a user has created
  public async list({ response, auth }) {
    try {
      await auth.getUser();
    } catch (error) {
      return response.send("Missing or invalid api token");
    }

    const services = (await auth.user.services().fetch()).rows;
    // Convert to array with all data Franz wants
    const servicesArray = services.map((service) => {
      const settings =
        typeof service.settings === "string" ? JSON.parse(service.settings) : service.settings;

      return {
        customRecipe: false,
        hasCustomIcon: !!settings.iconId,
        isBadgeEnabled: true,
        isDarkModeEnabled: "",
        isEnabled: true,
        isMuted: false,
        isNotificationEnabled: true,
        order: 1,
        spellcheckerLanguage: "",
        workspaces: [],
        ...settings,
        iconUrl: settings.iconId ? `${Env.get("APP_URL")}/v1/icon/${settings.iconId}` : null,
        id: service.serviceId,
        name: service.name,
        recipeId: service.recipeId,
        userId: auth.user.id,
      };
    });

    return response.send(servicesArray);
  }

  public async edit({ request, response, auth, params }) {
    try {
      await auth.getUser();
    } catch (error) {
      return response.send("Missing or invalid api token");
    }

    if (request.file("icon")) {
      // Upload custom service icon
      const icon = request.file("icon", {
        types: ["image"],
        size: "2mb",
      });
      const { id } = params;
      const service = await Service.query()
        .where("serviceId", id)
        .where("userId", auth.user.id)
        .first();
      const settings =
        typeof service?.settings === "string" ? JSON.parse(service.settings) : service?.settings;

      let iconId: string;
      do {
        iconId = uuid() + uuid();
      } while (fs.existsSync(path.join(Application.tmpPath("uploads"), iconId)));
      iconId = `${iconId}.${icon.extname}`;

      await icon.move(Application.tmpPath("uploads"), {
        name: iconId,
        overwrite: true,
      });

      if (!icon.moved()) {
        return response.status(500).send(icon.error());
      }

      const newSettings = {
        ...settings,
        ...{
          iconId,
          customIconVersion:
            settings && settings.customIconVersion ? settings.customIconVersion + 1 : 1,
        },
      };

      // Update data in database
      await Service.query()
        .where("serviceId", id)
        .where("userId", auth.user.id)
        .update({
          name: service?.name,
          settings: JSON.stringify(newSettings),
        });

      return response.send({
        data: {
          id,
          name: service?.name,
          ...newSettings,
          iconUrl: `${Env.get("APP_URL")}/v1/icon/${newSettings.iconId}`,
          userId: auth.user.id,
        },
        status: ["updated"],
      });
    }
    // Update service info
    const data = request.all();
    const { id } = params;

    // Get current settings from db
    const serviceData = await Service.query()
      .where("serviceId", id)
      .where("userId", auth.user.id)
      .first();

    const settings = {
      ...(typeof serviceData?.settings === "string"
        ? JSON.parse(serviceData?.settings)
        : serviceData?.settings),
      ...data,
    };

    // Update data in database
    await Service.query()
      .where("serviceId", id)
      .where("userId", auth.user.id)
      .update({
        name: data.name,
        settings: JSON.stringify(settings),
      });

    // Get updated row
    const service = await Service.query()
      .where("serviceId", id)
      .where("userId", auth.user.id)
      .first();

    return response.send({
      data: {
        id,
        name: service?.name,
        ...settings,
        iconUrl: `${Env.get("APP_URL")}/v1/icon/${settings.iconId}`,
        userId: auth.user.id,
      },
      status: ["updated"],
    });
  }

  public async icon({ params, response }) {
    const { id } = params;

    const iconPath = path.join(Application.tmpPath("uploads"), id);
    if (!fs.existsSync(iconPath)) {
      return response.status(404).send({
        status: "Icon doesn't exist",
      });
    }

    return response.download(iconPath);
  }

  public async reorder({ request, response, auth }) {
    const data = request.all();

    for (const service of Object.keys(data)) {
      // Get current settings from db
      const serviceData = await Service.query() // eslint-disable-line no-await-in-loop
        .where("serviceId", service)
        .where("userId", auth.user.id)
        .first();

      const settings = {
        ...(typeof serviceData?.settings === "string"
          ? JSON.parse(serviceData?.settings)
          : serviceData?.settings),
        order: data[service],
      };

      // Update data in database
      await Service.query() // eslint-disable-line no-await-in-loop
        .where("serviceId", service)
        .where("userId", auth.user.id)
        .update({
          settings: JSON.stringify(settings),
        });
    }

    // Get new services
    const services = (await auth.user.services().fetch()).rows;
    // Convert to array with all data Franz wants
    const servicesArray = services.map((service) => {
      const settings =
        typeof service.settings === "string" ? JSON.parse(service.settings) : service.settings;

      return {
        customRecipe: false,
        hasCustomIcon: !!settings.iconId,
        isBadgeEnabled: true,
        isDarkModeEnabled: "",
        isEnabled: true,
        isMuted: false,
        isNotificationEnabled: true,
        order: 1,
        spellcheckerLanguage: "",
        workspaces: [],
        ...settings,
        iconUrl: settings.iconId ? `${Env.get("APP_URL")}/v1/icon/${settings.iconId}` : null,
        id: service.serviceId,
        name: service.name,
        recipeId: service.recipeId,
        userId: auth.user.id,
      };
    });

    return response.send(servicesArray);
  }

  public update({ response }) {
    return response.send([]);
  }

  public async delete({ params, auth, response }) {
    // Update data in database
    await Service.query().where("serviceId", params.id).where("userId", auth.user.id).delete();

    return response.send({
      message: "Sucessfully deleted service",
      status: 200,
    });
  }
}

module.exports = ServiceController;
