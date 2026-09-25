import { DataTypes } from 'sequelize';

// users.status gains 'pending': people who sign in with Microsoft 365 but are not
// yet approved are saved as pending access requests for a Super Admin to review.
export async function up({ context: qi }) {
  await qi.changeColumn('users', 'status', {
    type: DataTypes.ENUM('pending', 'active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  });
}

export async function down({ context: qi }) {
  await qi.bulkUpdate('users', { status: 'inactive' }, { status: 'pending' });
  await qi.changeColumn('users', 'status', {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  });
}
