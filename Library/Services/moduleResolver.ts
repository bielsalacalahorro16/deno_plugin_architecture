import { Application } from "https://deno.land/x/opine@2.1.1/mod.ts";
import { IModuleResolver } from "../interfaces/IModuleResolver.ts";
import { log } from "../middleware/logger.ts";

class ModuleResolver implements IModuleResolver {
  modules: string[];
  mainApp: Application;
  modulesCount: number;
  registeredModules: string[];
  logger: any;

  constructor(app: Application) {
    this.mainApp = app;
    this.modules = [];
    this.modulesCount = 0;
    this.registeredModules = [];
    this.logger = log.getLogger();
  }

  /**
   * Register all the plugins from the modules.json file.
   * 
   */
  async getModules(): Promise<void> {
    const decoder: TextDecoder = new TextDecoder("utf-8");
    const data: Uint8Array = await Deno.readFile(
      "/Users/biel.sala/Desktop/CRM/Main/plugins.json",
    );
    const parsedData = JSON.parse(decoder.decode(data));

    if (!parsedData.hasOwnProperty("plugins")) {
      this.logger.error("Modules file has an incorrects format");
    }

    if (parsedData.hasOwnProperty("plugins")) {
      this.modules = parsedData.plugins;
      this.modulesCount = this.modules.length;
      this.logger.info(`All modules registered ${this.modules}`);
    }
  }

  /**
   * Register all the modules as middleware in the main application.
   * @param app - main application.
   */
  async mountModules(): Promise<void> {
    for (const plugin of this.modules) {
      try {
        if (this.registeredModules.includes(plugin)) {
          this.logger.error(`Module: ${plugin} is already registered.`);
        }

        const modulePath = `../Plugins/${plugin}/${plugin}.ts`;
        const path = await Deno.stat(modulePath);
        if (!path.isFile) {
          this.logger.warning(
            `Path: ${path} for module: ${plugin} is not existing.`,
          );
        }

        const { app } = await import(modulePath);
        if (typeof app === "function") {
          this.mainApp.use(app);
          this.registeredModules.push(plugin);
          this.logger.info(`Module loaded ${app}`);
        }
      } catch (error) {
        this.logger.error(`Failed loading module: ${error}`);
      }
    }
  }

  /**
   * unregister the module from the application
   * @param app - main application.
   * @param module - module to unregister.s
   * @alpha
   */
  async unmountModules(mainApp: Application, module: Application) {
    throw new Error("Method not implemented.");
  }
}
export { ModuleResolver };
