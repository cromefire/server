import Workspace from "App/Models/Workspace";
import { schema } from "@ioc:Adonis/Core/Validator";

import { v4 as uuid } from "uuid";

class WorkspaceController {
  // Create a new workspace for user
  public async create({ request, response, auth }) {
    try {
      await auth.getUser();
    } catch (error) {
      return response.send("Missing or invalid api token");
    }

    // Validate user input
    const workspaceSchema = schema.create({
      name: schema.string(),
    });

    try {
      await request.validate({
        schema: workspaceSchema,
      });
    } catch (error) {
      return response.badRequest(error.messages);
    }

    const data = request.all();

    // Get new, unused uuid
    let workspaceId: string;

    do {
      workspaceId = uuid();
    } while ((await Workspace.query().where("workspaceId", workspaceId)).length > 0); // eslint-disable-line no-await-in-loop

    const order = (await auth.user.workspaces().fetch()).rows.length;

    await Workspace.create({
      userId: auth.user.id,
      workspaceId,
      name: data.name,
      order,
      services: JSON.stringify([]),
      data: JSON.stringify(data),
    });

    return response.send({
      userId: auth.user.id,
      name: data.name,
      id: workspaceId,
      order,
      workspaces: [],
    });
  }

  public async edit({ request, response, auth, params }) {
    try {
      await auth.getUser();
    } catch (error) {
      return response.send("Missing or invalid api token");
    }

    // Validate user input
    const workspaceSchema = schema.create({
      name: schema.string(),
      services: schema.array().anyMembers(),
    });
    try {
      await request.validate({
        schema: workspaceSchema,
      });
    } catch (error) {
      return response.badRequest(error.messages);
    }

    const data = request.all();
    const { id } = params;

    // Update data in database
    await Workspace.query()
      .where("workspaceId", id)
      .where("userId", auth.user.id)
      .update({
        name: data.name,
        services: JSON.stringify(data.services),
      });

    // Get updated row
    const workspace = await Workspace.query()
      .where("workspaceId", id)
      .where("userId", auth.user.id)
      .first();

    return response.send({
      id: workspace?.workspaceId,
      name: data.name,
      order: workspace?.order,
      services: data.services,
      userId: auth.user.id,
    });
  }

  public async delete({ request, response, auth, params }) {
    try {
      await auth.getUser();
    } catch (error) {
      return response.send("Missing or invalid api token");
    }

    // Validate user input
    const workspaceSchema = schema.create({
      id: schema.string(),
    });

    try {
      await request.validate({
        schema: workspaceSchema,
      });
    } catch (error) {
      return response.badRequest(error.messages);
    }

    const { id } = params;

    // Update data in database
    await Workspace.query().where("workspaceId", id).where("userId", auth.user.id).delete();

    return response.send({
      message: "Successfully deleted workspace",
    });
  }

  // List all workspaces a user has created
  public async list({ response, auth }) {
    try {
      await auth.getUser();
    } catch (error) {
      return response.send("Missing or invalid api token");
    }

    const workspaces = (await auth.user.workspaces().fetch()).rows;
    // Convert to array with all data Franz wants
    let workspacesArray = [];
    if (workspaces) {
      workspacesArray = workspaces.map(
        (workspace: { workspaceId: string; name: string; order: number; services: string }) => ({
          id: workspace.workspaceId,
          name: workspace.name,
          order: workspace.order,
          services:
            typeof workspace.services === "string"
              ? JSON.parse(workspace.services)
              : workspace.services,
          userId: auth.user.id,
        }),
      );
    }

    return response.send(workspacesArray);
  }
}

module.exports = WorkspaceController;
