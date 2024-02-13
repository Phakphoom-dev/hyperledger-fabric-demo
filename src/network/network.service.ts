import * as grpc from '@grpc/grpc-js';
import {
  Contract,
  Gateway,
  Identity,
  Signer,
  connect,
  signers,
} from '@hyperledger/fabric-gateway';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { AssetDto } from './dto/assets.dto';
import { NetworkConfigService } from 'src/network-config/network-config.service';

@Injectable()
export class NetworkService {
  private utf8Decoder: TextDecoder;

  constructor(private networkConfigService: NetworkConfigService) {
    this.utf8Decoder = new TextDecoder();
  }

  async connectNetwork(): Promise<{ gateway: Gateway; client: grpc.Client }> {
    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client: grpc.Client = await this.newGrpcConnection();

    const gateway: Gateway = await connect({
      client,
      identity: await this.newIdentity(),
      signer: await this.newSigner(),
      // Default timeouts for different gRPC calls
      evaluateOptions: () => {
        return { deadline: Date.now() + 5000 }; // 5 seconds
      },
      endorseOptions: () => {
        return { deadline: Date.now() + 15000 }; // 15 seconds
      },
      submitOptions: () => {
        return { deadline: Date.now() + 5000 }; // 5 seconds
      },
      commitStatusOptions: () => {
        return { deadline: Date.now() + 60000 }; // 1 minute
      },
    });

    return { client, gateway };
  }

  public async displayInputParameters(): Promise<void> {
    console.log(`channelName:       ${this.networkConfigService.channelName}`);
    console.log(
      `chaincodeName:     ${this.networkConfigService.chaincodeName}`,
    );
    console.log(`mspId:             ${this.networkConfigService.mspId}`);
    console.log(`cryptoPath:        ${this.networkConfigService.cryptoPath}`);
    console.log(
      `keyDirectoryPath:  ${this.networkConfigService.keyDirectoryPath}`,
    );
    console.log(`certPath:          ${this.networkConfigService.certPath}`);
    console.log(`tlsCertPath:       ${this.networkConfigService.tlsCertPath}`);
    console.log(`peerEndpoint:      ${this.networkConfigService.peerEndpoint}`);
    console.log(
      `peerHostAlias:     ${this.networkConfigService.peerHostAlias}`,
    );
  }

  private async newGrpcConnection() {
    const tlsRootCert = await fs.readFile(
      this.networkConfigService.tlsCertPath,
    );
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(
      this.networkConfigService.peerEndpoint,
      tlsCredentials,
      {
        'grpc.ssl_target_name_override':
          this.networkConfigService.peerHostAlias,
      },
    );
  }

  private async newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(this.networkConfigService.certPath);

    return { mspId: this.networkConfigService.mspId, credentials };
  }

  private async newSigner(): Promise<Signer> {
    const files = await fs.readdir(this.networkConfigService.keyDirectoryPath);
    const keyPath = path.resolve(
      this.networkConfigService.keyDirectoryPath,
      files[0],
    );
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);

    return signers.newPrivateKeySigner(privateKey);
  }

  /**
   * This type of transaction would typically only be run once by an application the first time it was started after its
   * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
   */
  async initLedger(contract: Contract): Promise<void> {
    console.log(
      '\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger',
    );

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
  }

  /**
   * Evaluate a transaction to query ledger state.
   */
  async getAllAssets(contract: Contract): Promise<any> {
    console.log(
      '\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger',
    );

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = this.utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);

    return result;
  }

  /**
   * Submit a transaction synchronously, blocking until it has been committed to the ledger.
   */
  async createAsset(contract: Contract, assetDto: AssetDto): Promise<void> {
    const assetId = `asset${Date.now()}`;
    const { color, size, owner, appraisedValue } = assetDto;

    console.log(
      '\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments',
    );

    await contract.submitTransaction(
      'CreateAsset',
      assetId,
      color,
      size.toString(),
      owner,
      appraisedValue.toString(),
    );

    console.log('*** Transaction committed successfully');
  }

  async readAssetByID(contract: Contract, assetId: string): Promise<any> {
    console.log(
      '\n--> Evaluate Transaction: ReadAsset, function returns asset attributes',
    );

    const resultBytes = await contract.evaluateTransaction(
      'ReadAsset',
      assetId,
    );

    const resultJson = this.utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);

    return result;
  }
}
