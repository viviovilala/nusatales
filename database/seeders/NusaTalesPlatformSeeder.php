<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NusaTalesPlatformSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::query()->whereIn('email', [
            'user@nusatales.test',
            'uploader@nusatales.test',
            'creator@nusatales.test',
            'admin@nusatales.test',
        ])->get()->keyBy('email');

        foreach ($users->only(['uploader@nusatales.test', 'creator@nusatales.test']) as $user) {
            DB::table('channels')->updateOrInsert(
                ['user_id' => $user->user_id],
                [
                    'name' => $user->email === 'creator@nusatales.test' ? 'Studio Jati' : $user->nama,
                    'slug' => Str::slug($user->email === 'creator@nusatales.test' ? 'Studio Jati' : $user->nama).'-'.$user->user_id,
                    'subtitle' => $user->email === 'creator@nusatales.test' ? 'Sang Penjaga Legenda' : 'Sang Penjelajah Budaya',
                    'description' => 'Kanal NusaTales untuk animasi dan cerita Nusantara.',
                    'is_verified' => $user->email === 'creator@nusatales.test',
                    'status' => 'active',
                    'subscriber_count' => $user->email === 'creator@nusatales.test' ? 21400 : 320,
                    'video_count' => 0,
                    'total_views' => 0,
                    'monetization_status' => $user->email === 'creator@nusatales.test' ? 'active' : 'inactive',
                    'monetization_agreed_at' => $user->email === 'creator@nusatales.test' ? now() : null,
                    'monetization_enabled_at' => $user->email === 'creator@nusatales.test' ? now() : null,
                    'platform_fee_percentage' => 40,
                    'creator_share_percentage' => 60,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach ($users as $user) {
            DB::table('wallets')->updateOrInsert(
                ['user_id' => $user->user_id],
                [
                    'balance' => $user->email === 'user@nusatales.test' ? 1250 : 500,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        foreach ([
            ['Paket Pemula', 'pemula', 100, 0, 10000],
            ['Paket Menengah', 'menengah', 270, 0, 25000],
            ['Paket Sultan', 'sultan', 575, 0, 50000],
        ] as [$name, $code, $coins, $bonus, $price]) {
            DB::table('coin_packages')->updateOrInsert(
                ['code' => $code],
                [
                    'name' => $name,
                    'coins' => $coins,
                    'bonus_coins' => $bonus,
                    'price' => $price,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach ([
            ['Jawa Timur', 'jawa-timur', 'Legenda candi, kerajaan, dan pesisir timur Jawa.'],
            ['Jawa Tengah', 'jawa-tengah', 'Pusat peradaban megah dengan ribuan candi.'],
            ['Bali', 'bali', 'Pulau tarian, pura, dan kisah penjaga alam.'],
            ['Sumatera Barat', 'sumatera-barat', 'Legenda pesisir, adat, dan cerita Malin Kundang.'],
            ['Kalimantan', 'kalimantan', 'Hutan besar dan kisah penjaga sungai.'],
            ['Sulawesi', 'sulawesi', 'Cerita pelaut, kapal, dan pegunungan.'],
            ['Papua', 'papua', 'Kisah alam, burung surga, dan danau tinggi.'],
        ] as $index => [$name, $slug, $description]) {
            DB::table('regions')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'description' => $description,
                    'pin_x' => 20 + ($index * 9),
                    'pin_y' => 35 + ($index % 3 * 12),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach ([
            ['Kris Sakti Majapahit', 'kris-sakti-majapahit', 'Artefak', 4],
            ['Permata Cundamani', 'permata-cundamani', 'Efek', 8],
            ['Modern Batik', 'modern-batik', 'Kostum', 10],
            ['Ksatria Chibi Pack', 'ksatria-chibi-pack', 'Emoji', 20],
            ['Bingkai Candi', 'bingkai-candi', 'Penanda', 6],
            ['Efek Ombak Selatan', 'efek-ombak-selatan', 'Efek', 12],
        ] as [$title, $slug, $category, $coinPrice]) {
            DB::table('assets')->updateOrInsert(
                ['slug' => $slug],
                [
                    'title' => $title,
                    'category' => $category,
                    'description' => 'Aset digital Nusantara untuk memperkaya pengalaman NusaTales.',
                    'coin_price' => $coinPrice,
                    'price' => $coinPrice * 1000,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach ([
            ['Sayembara Karakter Wayang Modern', 'sayembara-karakter-wayang-modern'],
            ['Sayembara Cerita Pesisir', 'sayembara-cerita-pesisir'],
        ] as [$title, $slug]) {
            DB::table('challenges')->updateOrInsert(
                ['slug' => $slug],
                [
                    'title' => $title,
                    'description' => 'Tantangan kreatif untuk kreator NusaTales.',
                    'starts_at' => now()->subDays(7),
                    'ends_at' => now()->addDays(30),
                    'status' => 'active',
                    'rewards' => json_encode(['Kontrak Eksklusif', 'Lencana Emas', '5,000 NusaCoins', 'Paket Budaya']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach ([
            ['Misteri Borobudur', 'Mempelajari relief Kamadhatu yang menceritakan hukum sebab-akibat.'],
            ['Legenda Nyai Roro Kidul', 'Menelusuri mitologi samudra selatan melalui animasi.'],
            ['Jejak Sumpah Palapa', 'Mengenal persatuan Nusantara melalui sejarah.'],
            ['Timun Mas dan Hutan Ajaib', 'Mempelajari keberanian dalam cerita rakyat Jawa.'],
            ['Malin Kundang', 'Mengenali nilai hormat kepada orang tua.'],
        ] as [$title, $description]) {
            DB::table('cultural_missions')->updateOrInsert(
                ['title' => $title],
                [
                    'description' => $description,
                    'reward_points' => 50,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach ([
            'Ahli Wayang',
            'Penjelajah Ulung',
            'Master Storyteller Bronze Badge',
            'Penjaga Candi',
            'Pemetik Prasasti',
            'Sahabat Kreator',
        ] as $badge) {
            DB::table('badges')->updateOrInsert(
                ['slug' => Str::slug($badge)],
                [
                    'name' => $badge,
                    'description' => 'Lencana budaya NusaLanglang.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $creator = $users->get('creator@nusatales.test');

        if ($creator) {
            $channelId = DB::table('channels')->where('user_id', $creator->user_id)->value('id');

            DB::table('monetization_agreements')->updateOrInsert(
                ['user_id' => $creator->user_id],
                [
                    'channel_id' => $channelId,
                    'agreed' => true,
                    'platform_percentage' => 40,
                    'creator_percentage' => 60,
                    'creator_share_percent' => 60,
                    'platform_share_percent' => 40,
                    'agreement_text' => 'Saya menyetujui bahwa setiap pendapatan dari video/aset yang dimonetisasi akan dibagi 60% untuk kreator dan 40% untuk platform NusaTales.',
                    'agreed_at' => now(),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
