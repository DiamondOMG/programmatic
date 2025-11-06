"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFormat, createFormat, updateFormat, deleteFormat } from "@/app/lib/format";

export function useFormats() {
  return useQuery({
    queryKey: ['formats'],
    queryFn: getFormat,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateFormat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createFormat,
    onSuccess: () => {
      // Invalidate and refetch formats after successful creation
      queryClient.invalidateQueries({ queryKey: ['formats'] });
    },
  });
}

export function useUpdateFormat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ form_id, ...data }) => updateFormat(form_id, data),
    onSuccess: () => {
      // Invalidate and refetch formats after successful update
      queryClient.invalidateQueries({ queryKey: ['formats'] });
    },
  });
}

export function useDeleteFormat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteFormat,
    onSuccess: () => {
      // Invalidate and refetch formats after successful deletion
      queryClient.invalidateQueries({ queryKey: ['formats'] });
    },
  });
}

// Combined hook for all format operations
export function useFormat() {
  const { data: formats, isLoading, error, refetch } = useFormats();
  const createFormatMutation = useCreateFormat();
  const updateFormatMutation = useUpdateFormat();
  const deleteFormatMutation = useDeleteFormat();

  return {
    // Query state
    formats: formats || [],
    isLoading,
    error,
    refetch,
    
    // Mutations
    createFormat: createFormatMutation.mutateAsync,
    isCreating: createFormatMutation.isPending,
    
    updateFormat: updateFormatMutation.mutateAsync,
    isUpdating: updateFormatMutation.isPending,
    
    deleteFormat: deleteFormatMutation.mutateAsync,
    isDeleting: deleteFormatMutation.isPending,
  };
}

export default useFormat;