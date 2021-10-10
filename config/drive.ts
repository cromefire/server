import Env from "@ioc:Adonis/Core/Env";
import { DriveConfig } from "@ioc:Adonis/Core/Drive";

const driveConfig: DriveConfig = {
  /*
  |--------------------------------------------------------------------------
  | Default disk
  |--------------------------------------------------------------------------
  |
  | The default disk to use for managing file uploads. The value is driven by
  | the `DRIVE_DISK` environment variable.
  |
  */
  disk: Env.get("DRIVE_DISK"),

  disks: {
    /*
    |--------------------------------------------------------------------------
    | Local
    |--------------------------------------------------------------------------
    |
    | Local disk interacts with the a local folder inside your application
    |
    */
    local: {
      root: `${__dirname}/../recipes`,
      driver: "local",
    },

    /*
    |--------------------------------------------------------------------------
    | S3
    |--------------------------------------------------------------------------
    |
    | S3 disk interacts with a bucket on aws s3
    |
    */
    s3: {
      driver: "s3",
      key: Env.get("S3_KEY"),
      secret: Env.get("S3_SECRET"),
      bucket: Env.get("S3_BUCKET"),
      region: Env.get("S3_REGION"),
    },
  },
};

export default driveConfig;
