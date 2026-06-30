import { Plugin, Notice } from "obsidian";

export default class AtriumPlugin extends Plugin {
  async onload() {
    new Notice("Atrium loaded");
    console.log("Atrium loaded");
  }
  async onunload() {
    console.log("Atrium unloaded");
  }
}
