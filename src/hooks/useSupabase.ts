
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export function useSupabaseFetch<T>(
  key: string,
  tableName: string,
  options: {
    columns?: string;
    filter?: Record<string, any>;
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
  } = {}
) {
  const fetchData = async (): Promise<T[]> => {
    let query = supabase
      .from(tableName)
      .select(options.columns || '*');

    // Apply filters if provided
    if (options.filter) {
      Object.entries(options.filter).forEach(([column, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle special operators like in, gt, lt, etc.
          const [operator, operandValue] = Object.entries(value)[0];
          switch (operator) {
            case 'in':
              query = query.in(column, operandValue);
              break;
            case 'gt':
              query = query.gt(column, operandValue);
              break;
            case 'lt':
              query = query.lt(column, operandValue);
              break;
            case 'gte':
              query = query.gte(column, operandValue);
              break;
            case 'lte':
              query = query.lte(column, operandValue);
              break;
            default:
              query = query.eq(column, operandValue);
          }
        } else {
          // Standard equals operator
          query = query.eq(column, value);
        }
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      toast({
        title: 'Error',
        description: `Failed to fetch ${tableName}: ${error.message}`,
        variant: 'destructive',
      });
      throw error;
    }

    return data as T[];
  };

  return useQuery({
    queryKey: [key],
    queryFn: fetchData,
  });
}

export function useSupabaseMutation<T, U = T>(
  tableName: string,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  } = {}
) {
  const queryClient = useQueryClient();

  // For creating new records
  const createMutation = useMutation({
    mutationFn: async (newData: Omit<U, 'id'>) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(newData)
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        toast({
          title: 'Error',
          description: `Failed to create ${tableName}: ${error.message}`,
          variant: 'destructive',
        });
        throw error;
      }

      return data as T;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `${tableName} created successfully`,
      });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }
    },
    onError: (error) => {
      if (options.onError) {
        options.onError(error);
      }
    },
  });

  // For updating existing records
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<U> }) => {
      const { data: updatedData, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        toast({
          title: 'Error',
          description: `Failed to update ${tableName}: ${error.message}`,
          variant: 'destructive',
        });
        throw error;
      }

      return updatedData as T;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `${tableName} updated successfully`,
      });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }
    },
    onError: (error) => {
      if (options.onError) {
        options.onError(error);
      }
    },
  });

  // For deleting records
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting ${tableName}:`, error);
        toast({
          title: 'Error',
          description: `Failed to delete ${tableName}: ${error.message}`,
          variant: 'destructive',
        });
        throw error;
      }

      return id;
    },
    onSuccess: (id) => {
      toast({
        title: 'Success',
        description: `${tableName} deleted successfully`,
      });
      
      if (options.onSuccess) {
        options.onSuccess(id as unknown as T);
      }
      
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }
    },
    onError: (error) => {
      if (options.onError) {
        options.onError(error);
      }
    },
  });

  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Custom hook to check and establish the Supabase connection
export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkConnection() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('clients').select('id').limit(1);
        
        if (error) {
          throw error;
        }
        
        setIsConnected(true);
      } catch (error) {
        console.error('Supabase connection error:', error);
        setIsConnected(false);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to Supabase. Please check your configuration.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    checkConnection();
  }, []);

  return { isConnected, isLoading };
}
