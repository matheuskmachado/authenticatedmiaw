import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getConfig } from './config';
import { generateSignedToken } from './jwtService';

const config = getConfig(); 
const secretsManagerClient = new SecretsManagerClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    console.log('Starting JWT token generation...');

    try {
        if (!event.body) return createErrorResponse(400, 'Request body is missing');
        
        const userId = JSON.parse(event.body).userId;
        if (!userId) return createErrorResponse(400, 'userId is missing in the request body');

        console.log(`Generating token for the user: ${userId}`);
        
        const privateKey = await getSecret(config.SECRET_ARN);
        const token = generateSignedToken(userId, privateKey, config);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ token }),
        };

    } catch (error: any) {
        if (error instanceof SyntaxError) {
             return createErrorResponse(400, 'Invalid JSON format in request body');
        }
        console.error('Unexpected error during Lambda execution:', error);
        return createErrorResponse(500, `Internal Server Error: ${error.message}`);
    }
};

async function getSecret(secretArn: string): Promise<string> {
    try {
        const command = new GetSecretValueCommand({ SecretId: secretArn });
        const response = await secretsManagerClient.send(command);
        if (response.SecretString) return response.SecretString;
        throw new Error('SecretString not found in Secrets Manager response.');
    } catch (error) {
        console.error('Error fetching secret from Secrets Manager:', error);
        throw new Error('Could not retrieve private key');
    }
}

function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: message }),
    };
}