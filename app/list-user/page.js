import { getUserAll } from "@/app/lib/auth-actions";

export default async function ListUserPage() {
  const { success, data: users, message } = await getUserAll();

  if (!success) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User List</h1>
        <p className="text-red-500">Error: {message}</p>
      </div>
    );
  }

  const getPermissionLabel = (permission_user) => {
    switch (permission_user) {
      case 1:
        return "Viewer";
      case 2:
        return "Editor";
      case 3:
        return "Manager";
      case 4:
        return "Admin";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User List</h1>
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-3 px-4 bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider rounded-tl-lg">Email</th>
                  <th className="py-3 px-4 bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Permission</th>
                  <th className="py-3 px-4 bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {getPermissionLabel(user.permission_user)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-md text-xs mr-2 transition-colors duration-200">
                        Edit
                      </button>
                      <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md text-xs transition-colors duration-200">
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
    </div>
  );
}