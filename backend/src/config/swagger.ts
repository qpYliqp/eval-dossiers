import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MonMasterUB API',
            version: '1.0.0',
            description: 'API for managing and examining master\'s candidates at the University of Bordeaux.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
    },
    apis: [
        './src/routes/*.ts',
        './src/types/*.ts',
        './src/config/swagger-tags.ts'
    ],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };