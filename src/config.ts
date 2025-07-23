import * as jwt from 'jsonwebtoken';

export interface AppConfig {
    SECRET_ARN: string;
    JWT_ISSUER: string;
    JWT_AUDIENCE: string;
    JWT_EXPIRATION_IN_SECONDS: number;
    JWT_ALGORITHM: jwt.Algorithm;
    JWT_KEY_ID: string;
    SF_SOBJECT_API_NAME: string;
    SF_FIELD_API_NAME: string;
}

function getEnvVariable(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Configuration error: Mandatory environment variable '${key}' is not set.`);
    }
    return value;
}

export function getConfig(): AppConfig {
    return {
        SECRET_ARN: getEnvVariable('SECRET_ARN'),
        JWT_ISSUER: getEnvVariable('JWT_ISSUER'),
        JWT_AUDIENCE: getEnvVariable('JWT_AUDIENCE'),
        JWT_EXPIRATION_IN_SECONDS: parseInt(getEnvVariable('JWT_EXPIRATION', '300'), 10),
        JWT_ALGORITHM: getEnvVariable('JWT_ALGORITHM', 'RS256') as jwt.Algorithm,
        JWT_KEY_ID: getEnvVariable('JWT_KEY_ID'),
        SF_SOBJECT_API_NAME: getEnvVariable('SF_SOBJECT_API_NAME'),
        SF_FIELD_API_NAME: getEnvVariable('SF_FIELD_API_NAME'),
    };
}