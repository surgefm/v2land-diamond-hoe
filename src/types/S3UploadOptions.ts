interface S3UploadOptions {
  path?: string;
  file?: Buffer;
  key?: string;
  deleteOriginalFile?: boolean;
}

export default S3UploadOptions;
