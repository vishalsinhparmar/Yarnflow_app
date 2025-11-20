// Warehouse Locations for YarnFlow
export const WAREHOUSE_LOCATIONS = [
  { id: 'godown-maryadpatti', name: 'Godown - Maryadpatti', address: 'Maryadpatti, Punjab' },
  { id: 'godown-ludhiana', name: 'Godown - Ludhiana', address: 'Ludhiana, Punjab' },
  { id: 'godown-amritsar', name: 'Godown - Amritsar', address: 'Amritsar, Punjab' },
  { id: 'warehouse-main', name: 'Main Warehouse', address: 'Main Location' },
  { id: 'warehouse-secondary', name: 'Secondary Warehouse', address: 'Secondary Location' },
];

export const getWarehouseName = (id) => {
  const warehouse = WAREHOUSE_LOCATIONS.find(w => w.id === id);
  return warehouse ? warehouse.name : id || 'Unknown Location';
};

export const getWarehouseAddress = (id) => {
  const warehouse = WAREHOUSE_LOCATIONS.find(w => w.id === id);
  return warehouse ? warehouse.address : '';
};
