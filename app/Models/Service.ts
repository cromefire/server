import { BaseModel, belongsTo } from '@ioc:Adonis/Lucid/Orm';
import { BelongsTo } from '@ioc:Adonis/Lucid/Relations';
import User from 'App/Models/User';

export default class Service extends BaseModel {
  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;
}
