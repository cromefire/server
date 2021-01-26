import { BaseModel, belongsTo } from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';
import { BelongsTo } from '@ioc:Adonis/Lucid/Relations';

export default class Token extends BaseModel {
  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;
}
