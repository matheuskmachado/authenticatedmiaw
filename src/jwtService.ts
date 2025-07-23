import * as jwt from 'jsonwebtoken';
import { AppConfig } from './config';

export function generateSignedToken(userId: string, privateKey: string, config: AppConfig): string {
    const payload = {
        sub: userId,
        scv: {
            runtime_user_verification: {
                sub: {
                    link_to_entity_field: config.SF_FIELD_API_NAME,
                    link_to_entity_type: config.SF_SOBJECT_API_NAME,
                    record_id_type: config.SF_SOBJECT_API_NAME,
                },
            },
        },
    };

    const signOptions: jwt.SignOptions = {
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
        expiresIn: config.JWT_EXPIRATION_IN_SECONDS,
        
        header: {
            alg: config.JWT_ALGORITHM,
            kid: config.JWT_KEY_ID,
        }
    };

    const signedJwt = jwt.sign(payload, privateKey, signOptions);
    console.log('JWT token generated successfully.');
    return signedJwt;
}