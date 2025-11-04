"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getUserAll, deleteUser } from "@/app/lib/auth-actions";

const permissionMap = {
  1: "Viewer",
  2: "Editor",
  3: "Manager",
  4: "Admin",
};

export default function ListUserPage() {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUserAll,
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]); // Refetch users after successful deletion
      setShowDeleteModal(false);
      setUserToDeleteId(null);
      alert("User deleted successfully!"); // Optional: show success message
    },
    onError: (err) => {
      alert(`Error deleting user: ${err.message}`); // Optional: show error message
    },
  });

  const handleDeleteClick = (userId) => {
    setUserToDeleteId(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (userToDeleteId) {
      deleteUserMutation.mutate(userToDeleteId);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error.message}
      </div>
    );
  }

  const userList = users?.data || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">List User</h1>

      {/* User Roles Explanation Section */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-3xl bg-blue-200 text-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-3">
            User Roles and Permissions
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <span className="font-medium">Viewer:</span> Can only view
              campaigns.
            </li>
            <li>
              <span className="font-medium">Editor:</span> Can view, edit, and
              add campaigns.
            </li>
            <li>
              <span className="font-medium">Manager:</span> Can view, edit, and
              add campaigns, and view logs.
            </li>
            <li>
              <span className="font-medium">Admin:</span> Can view, edit, and
              add campaigns, view logs, view/edit sequences, view/edit formats,
              grant permissions, and delete users (excluding themselves and
              other admins).
            </li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-3 px-4 bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider rounded-tl-lg">
                    Email
                  </th>
                  <th className="py-3 px-4 bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="py-3 px-4 bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider rounded-tr-lg">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user) => (
                  <tr
                    key={user.user_id}
                    className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {permissionMap[user.permission_user] || "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-md text-xs mr-2 transition-colors duration-200">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.user_id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md text-xs transition-colors duration-200"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete this user? This action cannot be
              undo.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteUserMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
