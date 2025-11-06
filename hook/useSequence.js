"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSequence, createSequence, updateSequence, deleteSequence } from "@/app/lib/sequence";

export function useSequences() {
  return useQuery({
    queryKey: ['sequences'],
    queryFn: getSequence,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSequence,
    onSuccess: () => {
      // Invalidate and refetch sequences after successful creation
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ seq_id, ...data }) => updateSequence(seq_id, data),
    onSuccess: () => {
      // Invalidate and refetch sequences after successful update
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSequence,
    onSuccess: () => {
      // Invalidate and refetch sequences after successful deletion
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });
}

// Combined hook for all sequence operations
export function useSequence() {
  const { data: sequences, isLoading, error, refetch } = useSequences();
  const createSequenceMutation = useCreateSequence();
  const updateSequenceMutation = useUpdateSequence();
  const deleteSequenceMutation = useDeleteSequence();

  return {
    // Query state
    sequences: sequences || [],
    isLoading,
    error,
    refetch,
    
    // Mutations
    createSequence: createSequenceMutation.mutateAsync,
    isCreating: createSequenceMutation.isPending,
    
    updateSequence: updateSequenceMutation.mutateAsync,
    isUpdating: updateSequenceMutation.isPending,
    
    deleteSequence: deleteSequenceMutation.mutateAsync,
    isDeleting: deleteSequenceMutation.isPending,
  };
}

export default useSequence;