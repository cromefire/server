import Schema from "@ioc:Adonis/Lucid/Schema";

class UsersUpdateSchema extends Schema {
  public up() {
    this.table("users", (table) => {
      table.string("lastname", 80).notNullable().default("");
    });
  }

  public down() {
    this.table("users", (table) => {
      table.dropColumn("lastname");
    });
  }
}

module.exports = UsersUpdateSchema;
