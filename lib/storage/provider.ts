export interface StorageProvider {
  createAttachmentLink(input: { title: string; url: string }): Promise<{
    title: string;
    url: string;
  }>;
}

export class LinkOnlyStorageProvider implements StorageProvider {
  async createAttachmentLink(input: { title: string; url: string }) {
    return {
      title: input.title,
      url: input.url,
    };
  }
}

export const storageProvider = new LinkOnlyStorageProvider();
