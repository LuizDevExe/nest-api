import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  describe('getMe', () => {
    it('lança UnauthorizedException quando o usuário do token não existe mais', async () => {
      const userService = {
        getUser: jest
          .fn()
          .mockRejectedValue(new NotFoundException('User not found')),
      } as unknown as UserService;
      const controller = new UserController(userService);

      await expect(controller.getMe(1)).rejects.toThrow(UnauthorizedException);
    });
  });
});
