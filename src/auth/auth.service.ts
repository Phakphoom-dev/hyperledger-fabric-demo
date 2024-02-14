import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { buildCCPOrg1, buildWallet } from 'src/utils/app-utils';
import {
  buildCAClient,
  enrollAdmin,
  registerAndEnrollUser,
} from 'src/utils/ca-utils';
import { NetworkConfigService } from 'src/network-config/network-config.service';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private networkConfigService: NetworkConfigService,
    private prismaService: PrismaService,
  ) {}

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);

    if (!user) throw new ForbiddenException('Credentials incorrect');

    const pwMatched = await argon.verify(user.password, pass);

    if (!pwMatched) throw new ForbiddenException('Credentials incorrect');

    delete user.password;

    return user;
  }

  async register(registerDto: RegisterDto) {
    const { username, password, firstname, lastname } = registerDto;
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    const caClient = buildCAClient(ccp, 'ca.org1.example.com');

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(this.networkConfigService.walletPath);

    try {
      await this.prismaService.user.create({
        data: {
          username,
          password: await argon.hash(password),
          firstname,
          lastname,
        },
      });
    } catch (e) {
      throw new ConflictException(
        `An identity for the user ${username} already exists in the database`,
      );
    }

    // in a real application this would be done on an administrative flow, and only once
    await enrollAdmin(caClient, wallet, this.networkConfigService.mspId);

    // in a real application this would be done only when a new user was required to be added
    // and would be part of an administrative flow
    await registerAndEnrollUser(
      caClient,
      wallet,
      this.networkConfigService.mspId,
      registerDto.username,
      'org1.department1',
    );
  }
}
