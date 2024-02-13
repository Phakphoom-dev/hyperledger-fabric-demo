import { Injectable } from '@nestjs/common';
import { envOrDefault } from 'src/utils/helper';
import * as grpc from '@grpc/grpc-js';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class NetworkConfigService {
  public cryptoPath: string;
  public channelName: string;
  public chaincodeName: string;
  public mspId: string;
  public tlsCertPath: string;
  public peerEndpoint: string;
  public peerHostAlias: string;
  public keyDirectoryPath: string;
  public certPath: string;

  constructor() {
    this.channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
    this.chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
    this.mspId = envOrDefault('MSP_ID', 'Org1MSP');
    this.cryptoPath = envOrDefault(
      'CRYPTO_PATH',
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'fabric-samples',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com',
      ),
    );

    this.tlsCertPath = envOrDefault(
      'TLS_CERT_PATH',
      path.resolve(
        this.cryptoPath,
        'peers',
        'peer0.org1.example.com',
        'tls',
        'ca.crt',
      ),
    );

    this.peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');
    this.peerHostAlias = envOrDefault(
      'PEER_HOST_ALIAS',
      'peer0.org1.example.com',
    );

    this.keyDirectoryPath = envOrDefault(
      'KEY_DIRECTORY_PATH',
      path.resolve(
        this.cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'keystore',
      ),
    );

    this.certPath = envOrDefault(
      'CERT_PATH',
      path.resolve(
        this.cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'signcerts',
        'cert.pem',
      ),
    );
  }

  public async newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(this.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(this.peerEndpoint, tlsCredentials, {
      'grpc.ssl_target_name_override': this.peerHostAlias,
    });
  }
}
