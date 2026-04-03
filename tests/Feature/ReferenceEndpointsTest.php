<?php

namespace Tests\Feature;

use App\Models\CeritaRakyat;
use App\Models\Kategori;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferenceEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_endpoint_returns_reference_list(): void
    {
        Kategori::query()->create([
            'nama_kategori' => 'Folklore',
        ]);

        $response = $this->getJson('/api/v1/references/categories');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name'],
                ],
            ]);
    }

    public function test_stories_endpoint_returns_reference_list(): void
    {
        CeritaRakyat::query()->create([
            'judul_cerita' => 'Malin Kundang',
            'asal_daerah' => 'West Sumatra',
            'deskripsi' => 'Story description',
            'pesan_moral' => 'Be respectful.',
            'sumber' => 'Seeder',
        ]);

        $response = $this->getJson('/api/v1/references/stories');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'title', 'region', 'description', 'moral_message', 'source'],
                ],
            ]);
    }
}
