import React, { useState, useEffect } from 'react';
import Spinner from '@/components/elements/Spinner';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { http } from '@/api/http';
import { ServerContext } from '@/state/server';
import Modal from '@/components/elements/Modal';
import Button from '@/components/elements/Button';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';

interface Subdomain {
    id: string;
    subdomain: string;
    allocation: string;
}

export default () => {
    const uuid = ServerContext.useStoreState(state => state.server.data?.uuid);
    const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false); // Controla el modal
    
    // Estados del formulario del modal
    const [subdomainInput, setSubdomainInput] = useState('');
    const [selectedAllocation, setSelectedAllocation] = useState('');
    const [allocations, setAllocations] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSubdomains = () => {
        setLoading(true);
        http.get(`/api/client/servers/${uuid}/subdomains`)
            .then(res => setSubdomains(res.data.data || []))
            .catch(() => setSubdomains([]))
            .finally(() => setLoading(false));
    };

    const fetchAllocations = () => {
        http.get(`/api/client/servers/${uuid}`)
            .then(res => {
                // Aquí extraemos las asignaciones (allocations) del servidor de Pterodactyl
                setAllocations(res.data.relationships?.allocations?.data || []);
            });
    };

    useEffect(() => {
        if (uuid) {
            fetchSubdomains();
            fetchAllocations();
        }
    }, [uuid]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        http.post(`/api/client/servers/${uuid}/subdomains`, {
            subdomain: subdomainInput,
            allocation: selectedAllocation
        })
        .then(() => {
            setVisible(false);
            setSubdomainInput('');
            fetchSubdomains();
        })
        .catch(err => {
            console.error(err);
        })
        .finally(() => setIsSubmitting(false));
    };

    const handleDelete = (subdomainId: string) => {
        http.delete(`/api/client/servers/${uuid}/subdomains/${subdomainId}`)
            .then(() => fetchSubdomains());
    };

    return (
        <ServerContentBlock title="Subdomain">
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-neutral-400">
                    Subdomains allow you to create custom subdomains for your server. Each subdomain can be assigned to a specific allocation.
                </p>
                <Button onClick={() => setVisible(true)} className="bg-blue-600 hover:bg-blue-700">
                    Create subdomain
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Spinner size="large" /></div>
            ) : (
                <div className="space-y-3">
                    {subdomains.length === 0 ? (
                        <p className="text-center text-neutral-500 py-6 bg-neutral-800/40 rounded-lg">No subdomains found for this server.</p>
                    ) : (
                        subdomains.map(sub => (
                            <div key={sub.id} className="bg-neutral-800 p-4 rounded-lg flex items-center justify-between border border-neutral-700/50">
                                <div>
                                    <span className="text-xs text-neutral-400 block uppercase font-semibold">Subdomain</span>
                                    <span className="text-white font-medium">{sub.subdomain}.tudominio.com</span>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block uppercase font-semibold">Allocation</span>
                                    <span className="text-neutral-300 font-mono text-sm">{sub.allocation}</span>
                                </div>
                                <Button 
                                    className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1.5"
                                    onClick={() => handleDelete(sub.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Creación */}
            <Modal visible={visible} onDismissed={() => setVisible(false)}>
                <h3 className="text-lg font-semibold text-white mb-4">Create Subdomain</h3>
                <form onSubmit={handleCreate}>
                    <div className="mb-4">
                        <Label>Subdomain</Label>
                        <Input 
                            value={subdomainInput} 
                            onChange={e => setSubdomainInput(e.target.value)} 
                            placeholder="play" 
                            required 
                        />
                    </div>

                    <div className="mb-4">
                        <Label>Allocation</Label>
                        <Select 
                            value={selectedAllocation} 
                            onChange={e => setSelectedAllocation(e.target.value)}
                            required
                        >
                            <option value="">Selecciona una IP:Puerto</option>
                            {allocations.map(alloc => (
                                <option key={alloc.attributes.id} value={`${alloc.attributes.ip}:${alloc.attributes.port}`}>
                                    {alloc.attributes.ip}:{alloc.attributes.port}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <Button type="button" className="bg-neutral-700" onClick={() => setVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size="small" /> : 'Create Subdomain'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </ServerContentBlock>
    );
};
