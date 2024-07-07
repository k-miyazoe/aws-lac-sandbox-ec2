import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //VPC[ip空間]
    const vpc = new ec2.CfnVPC(this, 'VPC', {
      cidrBlock: '10.0.10.0/16',
    });
    //Internet Gateway[インターネットとVPCの接続]
    const igw = new ec2.CfnInternetGateway(this, 'IGW');
    const vpcAttachment = new ec2.CfnVPCGatewayAttachment(this, 'VPCGatewayAttachment', {
      vpcId: vpc.ref,
      internetGatewayId: igw.ref,
    });
    //Route Table
    const routeTable = new ec2.CfnRouteTable(this, 'RouteTable', {
      vpcId: vpc.ref,
    });
    //EC2-keypair
    const keyPair = new ec2.CfnKeyPair(this, 'KeyPair', {
      keyName: 'ec2-keypair',
    });
    //output secret key
    new cdk.CfnOutput(this, 'KeyPairPrivateKey', {
      value: keyPair.attrKeyPairId,
      description: 'The private key to use when connecting to the EC2 instances',
    });
    //Subnet
    const subnetPublic = new ec2.CfnSubnet(this, 'SubnetPublic-1a', {
      vpcId: vpc.ref,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: 'ap-northeast-1a',
    });
    const subnetPrivate = new ec2.CfnSubnet(this, 'SubnetPrivate-1a', {
      vpcId: vpc.ref,
      cidrBlock: '10.0.31.0/24',
      availabilityZone: 'ap-northeast-1a',
    });
    //Route Table Association[ public subnet と route table の関連付け]
    const routeTableAssociationPublic = new ec2.CfnSubnetRouteTableAssociation(this, 'RouteTableAssociationPublic', {
      subnetId: subnetPublic.ref,
      routeTableId: routeTable.ref,
    });
    //Security Group
    const securityGroup = new ec2.CfnSecurityGroup(this, 'SecurityGroup', {
      vpcId: vpc.ref,
      groupDescription: 'EC2 Security Group',
      groupName: 'EC2SecurityGroup',
      securityGroupIngress: [{
        ipProtocol: 'tcp',
        fromPort: 22,
        toPort: 22,
        cidrIp: '0.0.0.0/0',
      }],
    });
    //EC2 Instance
    const instance = new ec2.CfnInstance(this, 'Instance', {
      imageId: new ec2.AmazonLinuxImage().getImage(this).imageId,
      instanceType: 't2.micro',
      keyName: keyPair.ref,
      networkInterfaces: [{
        deviceIndex: '0',
        associatePublicIpAddress: true,
        subnetId: subnetPublic.ref,
        groupSet: [securityGroup.ref],
      }],
      tags: [{
        key: 'lac',
        value: 'EC2Instance',
      }],
    });
  }
}
