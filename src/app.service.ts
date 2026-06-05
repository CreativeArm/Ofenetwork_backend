import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: "OFENETWORKS API",
      status: "ok",
      release: {
        socialAuthFix: "callback-timeout-v2",
        commit: process.env.RENDER_GIT_COMMIT ?? "local",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
