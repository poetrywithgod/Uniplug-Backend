import { NODE_ENV } from '../configs/envConfig';
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/prisma';

interface CustomError extends Error {
    statusCode: number;
    status: string;
    code?: number | string;
    keyValue?: { [key: string]: any };
    errors?: { [key: string]: any };
}

const handleDuplicateKeyError = (err: CustomError): CustomError => {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue?.[field];
    const message = `Duplicate value for ${field}: ${value}. Please use another value.`;

    return {
        ...err,
        statusCode: 400,
        status: 'fail',
        message,
    };
};

const handleValidationError = (err: CustomError): CustomError => {
    if (err.errors) {
        const errorMessages: string[] = [];

        for (const field in err.errors) {
            const fieldError = err.errors[field];

            // Handle enum validation errors dynamically
            if (fieldError.kind === 'enum') {
                const validValues = fieldError.properties?.enumValues || [];
                const invalidValue = fieldError.value;
                const message = `Invalid value '${invalidValue}' for field '${field}'. Allowed values are: ${validValues.join(', ')}.`;
                errorMessages.push(message);
            }
            // Handle other validation errors
            else if (fieldError.name === 'ValidatorError') {
                errorMessages.push(
                    fieldError.message || `Invalid value for field '${field}'.`,
                );
            }
            // Handle any other validation errors
            else if (fieldError.message) {
                errorMessages.push(fieldError.message);
            }
        }

        // If we have specific error messages, use them
        if (errorMessages.length > 0) {
            const message = errorMessages.join(' ');
            return {
                ...err,
                statusCode: 400,
                status: 'fail',
                message,
            };
        }

        // Fallback for other validation errors
        const errors = Object.values(err.errors).map(
            (val: any) => val.message || 'Validation error',
        );
        const message = `Invalid input data. ${errors.join('. ')}`;
        return {
            ...err,
            statusCode: 400,
            status: 'fail',
            message,
        };
    }

    return err;
};

const sendDevError = (err: CustomError, res: Response): void => {
    res.status(err.statusCode).send({
        status: err.status,
        message: err.message,
        stack: err.stack,
    });
};

const sendProdError = (err: CustomError, res: Response): void => {
    res.status(err.statusCode).send({
        status: err.status,
        message: err.message,
    });
};

export default (err: any, _req: Request, res: Response, next: NextFunction) => {
    let errorObj: CustomError = {
        name: err.name || 'Error',
        message: err.message || 'An unexpected error occurred.',
        stack: err.stack,
        statusCode: err.statusCode || 500,
        status: err.status || 'error',
        code: err.code,
        keyValue: err.keyValue,
        errors: err.errors,
    };

    console.error('Error occurred 🤯💥:', err);

    // Handle MongoDB native duplicate key error
    if (err.code === 11000) {
        errorObj = handleDuplicateKeyError(errorObj);
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        errorObj = handleValidationError(errorObj);
    }

    // Handle Prisma specific exceptions
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const target = (err.meta?.target as string[]) || [];
            // Parse targeted fields or constraint names (e.g. User_email_key -> email)
            const fields = target.map(t => t.split('_')[1] || t).join(', ');
            errorObj.statusCode = 409;
            errorObj.status = 'fail';
            errorObj.message = fields 
                ? `A record with this ${fields} already exists.`
                : 'A unique constraint failure occurred. This record already exists.';
        } else if (err.code === 'P2025') {
            errorObj.statusCode = 404;
            errorObj.status = 'fail';
            errorObj.message = (err.meta?.cause as string) || 'The requested record was not found.';
        } else if (err.code === 'P2003') {
            errorObj.statusCode = 400;
            errorObj.status = 'fail';
            errorObj.message = 'A database relation constraint failed (invalid ID reference).';
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        errorObj.statusCode = 400;
        errorObj.status = 'fail';
        errorObj.message = 'Invalid data provided for database operation.';
    }

    // Final normalization
    errorObj.statusCode = errorObj.statusCode ?? 500;
    errorObj.status = errorObj.statusCode >= 400 && errorObj.statusCode < 500 ? 'fail' : 'error';

    NODE_ENV === 'prod' ? sendProdError(errorObj, res) : sendDevError(errorObj, res);

    next();
};
