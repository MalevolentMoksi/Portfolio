/// <reference types="vite/client" />

/** Build date injected by vite.config.ts via define() */
declare const __BUILD_DATE__: string;

/** Unique id of this build, also published in version.json (see utils/appUpdate.ts) */
declare const __APP_BUILD_ID__: string;
