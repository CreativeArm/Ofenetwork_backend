import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfilePictureDto } from "./dto/update-profile-picture.dto";

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

  @Patch(":id/profile-picture")
  updateProfilePicture(
    @Param("id") id: string,
    @Body() payload: UpdateProfilePictureDto,
  ) {
    return this.usersService.updateProfilePicture(id, payload);
  }
}
