<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dsrs', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('name')->nullable();
            $table->string('signature')->nullable();
            $table->string('state')->default('Draft');
            $table->json('uplinks');
            $table->json('p2p');
            $table->json('firewall');
            $table->json('kb');
            $table->json('chq');
            $table->json('ups');
            $table->json('cooling');
            $table->text('general_remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dsrs');
    }
};
