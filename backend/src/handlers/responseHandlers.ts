import { Response } from "express";

export const handleSuccess = (
    res: Response,
    statusCode: number,
    message: string,
    data: unknown = null
): void => {
    res.status(statusCode).json({
        message,
        data,
        status: "Success",
    });
};

export const handleErrorClient = (
    res: Response,
    statusCode: number,
    message: string,
    errorDetails: unknown = null
): void => {
    res.status(statusCode).json({
        message,
        errorDetails,
        status: "Client error",
    });
};

export const handleErrorServer = (
    res: Response,
    statusCode: number,
    message: string,
    errorDetails: unknown = null
): void => {
    console.error("Server Error:", message, errorDetails);
    res.status(statusCode).json({
        message,
        errorDetails,
        status: "Server error",
    });
};