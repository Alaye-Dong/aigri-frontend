declare namespace Api {
  namespace File {
    /** 文件上传结果 */
    interface UploadResult {
      /** 文件访问URL */
      url: string;
      /** 文件名称 */
      fileName: string;
      /** 文件大小(字节) */
      fileSize: number;
    }
  }
}
