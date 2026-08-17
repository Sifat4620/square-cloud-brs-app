<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('backup_test_id')->constrained('backup_tests')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients');
            $table->string('client_name');
            $table->string('logs_status')->nullable();
            $table->string('test_status')->default('OK');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_entries');
    }
};
