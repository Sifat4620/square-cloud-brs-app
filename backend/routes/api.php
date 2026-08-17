<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DsrController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dsrs', [DsrController::class, 'index']);
    Route::post('/dsrs', [DsrController::class, 'store']);
    Route::get('/dsrs/{dsr}', [DsrController::class, 'show']);
    Route::put('/dsrs/{dsr}', [DsrController::class, 'update']);
    Route::delete('/dsrs/{dsr}', [DsrController::class, 'destroy']);

    Route::get('/backups', [BackupController::class, 'index']);
    Route::post('/backups', [BackupController::class, 'store']);
    Route::get('/backups/{backup}', [BackupController::class, 'show']);
    Route::put('/backups/{backup}', [BackupController::class, 'update']);
    Route::delete('/backups/{backup}', [BackupController::class, 'destroy']);

    Route::get('/clients', [ClientController::class, 'index']);
    Route::post('/clients', [ClientController::class, 'store']);
    Route::put('/clients/{client}', [ClientController::class, 'update']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
});
