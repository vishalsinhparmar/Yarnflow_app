import { Stack } from 'expo-router';

export default function MasterDataLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Customer Routes */}
      <Stack.Screen 
        name="customers/index" 
        options={{ 
          title: 'Customer Management',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="customers/form" 
        options={{ 
          title: 'Customer Form',
          presentation: 'modal',
          headerBackTitle: 'Cancel'
        }}
      />
      
      {/* Supplier Routes */}
      <Stack.Screen 
        name="suppliers/index" 
        options={{ 
          title: 'Supplier Management',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="suppliers/form" 
        options={{ 
          title: 'Supplier Form',
          presentation: 'modal',
          headerBackTitle: 'Cancel'
        }}
      />
      
      {/* Product Routes */}
      <Stack.Screen 
        name="products/index" 
        options={{ 
          title: 'Product Management',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="products/form" 
        options={{ 
          title: 'Product Form',
          presentation: 'modal',
          headerBackTitle: 'Cancel'
        }}
      />
      
      {/* Category Routes */}
      <Stack.Screen 
        name="categories/index" 
        options={{ 
          title: 'Category Management',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="categories/form" 
        options={{ 
          title: 'Category Form',
          presentation: 'modal',
          headerBackTitle: 'Cancel'
        }}
      />

      {/* Sub-Products Routes */}
      <Stack.Screen 
        name="sub-products/index" 
        options={{ 
          title: 'Sub-Products',
          headerBackTitle: 'Back'
        }}
      />
    </Stack>
  );
}
