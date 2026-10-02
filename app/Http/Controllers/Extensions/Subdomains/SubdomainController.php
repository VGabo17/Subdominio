namespace App\Http\Controllers\Extensions\Subdomains;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\Controller;
use App\Models\Server;

class SubdomainController extends Controller
{
    // Listar subdominios del servidor
    public function index(Request $request, string $uuid)
    {
        $server = Server::where('uuid', $uuid)->firstOrFail();
        
        // Aquí puedes consultar tu base de datos local donde guardes los subdominios creados
        // Por ahora devolvemos un array vacío de prueba:
        return response()->json(['data' => []]);
    }

    // Crear subdominio vía Spaceship API
    public function store(Request $request, string $uuid)
    {
        $server = Server::where('uuid', $uuid)->firstOrFail();
        
        $subdomain = $request->input('subdomain');
        $allocation = $request->input('allocation'); // Viene en formato "IP:Puerto"
        
        list($ip, $port) = explode(':', $allocation);
        $domain = "tudominio.com"; // El dominio base que hayas configurado

        // Petición oficial a la API de Spaceship para crear el registro DNS (Tipo A)
        $response = Http::withHeaders([
            'X-API-Key' => env('SPACESHIP_API_KEY'),
            'X-API-Secret' => env('SPACESHIP_API_SECRET'),
        ])->put("https://spaceship.dev/api/v1/domains/{$domain}/records", [
            'records' => [
                [
                    'type' => 'A',
                    'name' => $subdomain,
                    'address' => $ip,
                    'ttl' => 300
                ]
            ]
        ]);

        if ($response->successful()) {
            // Opcional: Guarda los datos en una tabla de base de datos de tu addon
            return response()->json(['success' => true, 'message' => 'Subdominio creado correctamente']);
        }

        return response()->json([
            'success' => false, 
            'message' => 'Error al comunicarse con la API de Spaceship.'
        ], 500);
    }

    // Eliminar subdominio
    public function destroy(string $uuid, string $subdomainId)
    {
        $server = Server::where('uuid', $uuid)->firstOrFail();
        
        // Lógica para eliminar el registro DNS en Spaceship y en tu base de datos local

        return response()->json(['success' => true]);
    }
}
