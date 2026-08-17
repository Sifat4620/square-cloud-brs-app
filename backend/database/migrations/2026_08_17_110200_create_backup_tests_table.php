<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_tests', function (Blueprint $table) {
            $table->id();
            $table->integer('year');
            $table->integer('month');
            $table->string('state')->default('Pending');
            $table->string('responsible_name')->nullable();
            $table->string('responsible_designation')->nullable();
            $table->date('date')->nullable();
            $table->string('signature')->nullable();
            $table->timestamps();
            $table->unique(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_tests');
    }
};
