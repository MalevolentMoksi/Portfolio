declare module 'jsmediatags' {
  export function read(
    url: string,
    callbacks: {
      onSuccess: (tag: {
        tags: {
          title?: string;
          artist?: string;
          picture?: { data: number[]; format: string };
          [key: string]: unknown;
        };
      }) => void;
      onError: (error: { type: string; info: string }) => void;
    }
  ): void;

  export class Reader {
    constructor(url: string);
    read(callbacks: {
      onSuccess: (tag: {
        tags: {
          title?: string;
          artist?: string;
          picture?: { data: number[]; format: string };
          [key: string]: unknown;
        };
      }) => void;
      onError: (error: { type: string; info: string }) => void;
    }): void;
  }
}
