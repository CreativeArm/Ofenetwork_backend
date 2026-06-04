import { Controller, Get, Param, Query } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers(@Query("search") search?: string) {
    return search ? this.usersService.search(search) : this.usersService.listUsers();
  }

  @Get(":id")
  getUser(@Param("id") id: string) {
    return this.usersService.getUser(id);
  }
}
