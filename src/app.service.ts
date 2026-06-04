import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: "OFENETWORKS API",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
