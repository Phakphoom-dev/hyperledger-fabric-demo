import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AssetDto } from './dto/assets.dto';
import { NetworkService } from './network.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { NetworkConfigService } from 'src/network-config/network-config.service';
import { GetUser } from 'src/decorator/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('networks')
export class NetworkController {
  constructor(
    private networkService: NetworkService,
    private networkConfigService: NetworkConfigService,
  ) {}

  @Post('init-ledger')
  async initLedger(@GetUser() user) {
    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork(user);

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(this.networkConfigService.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(
        this.networkConfigService.chaincodeName,
      );

      await this.networkService.initLedger(contract);
    } catch (e) {
      console.log('🚀 ~ NetworkController ~ initLedger ~ e:', e);
    } finally {
      gateway.close();
      client.close();
    }
  }

  @Get('all-assets')
  async getAllAssets(@GetUser() user) {
    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork(user);

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(this.networkConfigService.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(
        this.networkConfigService.chaincodeName,
      );

      const assets = await this.networkService.getAllAssets(contract);

      return { total: assets.length, data: assets };
    } catch (e) {
      console.log('🚀 ~ NetworkController ~ getAllAssets ~ e:', e);
    } finally {
      gateway.close();
      client.close();
    }
  }

  @Get('read-asset/:id')
  async readAssetByID(@Param('id') assetId: string, @GetUser() user) {
    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork(user);

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(this.networkConfigService.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(
        this.networkConfigService.chaincodeName,
      );

      return await this.networkService.readAssetByID(contract, assetId);
    } catch (e) {
      throw new HttpException('Asset Not Found', HttpStatus.NOT_FOUND);
    } finally {
      gateway.close();
      client.close();
    }
  }

  @Post('create-asset')
  async createAsset(@Body() assetDto: AssetDto, @GetUser() user) {
    await this.networkService.displayInputParameters();

    const { client, gateway } = await this.networkService.connectNetwork(user);

    try {
      // Get a network instance representing the channel where the smart contract is deployed.
      const network = gateway.getNetwork(this.networkConfigService.channelName);

      // Get the smart contract from the network.
      const contract = network.getContract(
        this.networkConfigService.chaincodeName,
      );

      await this.networkService.createAsset(contract, assetDto);

      return {
        message: 'created success',
        status: HttpStatus.CREATED,
      };
    } catch (e) {
      console.log('🚀 ~ NetworkController ~ getAllAssets ~ e:', e);
    } finally {
      gateway.close();
      client.close();
    }
  }
}
