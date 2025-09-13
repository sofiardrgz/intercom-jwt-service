const INTERCOM_SECRET = "4tFWC4_b6_749nXgAU5xLt8Zyrhaxcmomxmpr6dKFxQ";

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
        };
    }
    
    try {
        const { user_id, email, name, location_id } = JSON.parse(event.body || '{}');
        
        if (!user_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'user_id is required' })
            };
        }
        
        const header = { alg: "HS256", typ: "JWT" };
        const payload = {
            user_id: user_id,
            email: email || '',
            name: name || '',
            exp: Math.floor(Date.now() / 1000) + 3600
        };
        
        // Add location_id to payload if provided
        if (location_id) {
            payload.location_id = location_id;
        }
        
        function base64UrlEncode(obj) {
            return Buffer.from(JSON.stringify(obj))
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        }
        
        const headerEncoded = base64UrlEncode(header);
        const payloadEncoded = base64UrlEncode(payload);
        
        const crypto = require('crypto');
        const message = headerEncoded + "." + payloadEncoded;
        const signature = crypto
            .createHmac('sha256', INTERCOM_SECRET)
            .update(message)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        
        const token = message + "." + signature;
        
        const response = {
            token: token,
            expires_in: 3600,
            user_id: user_id
        };
        
        // Include location_id in response if provided
        if (location_id) {
            response.location_id = location_id;
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to generate JWT token',
                message: error.message 
            })
        };
    }
};
