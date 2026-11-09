import mongoose from "mongoose";
import Address from "../models/address.model";
import User from "../models/user.model";

export async function getUserAddresses(userId: string) {
  return Address.find({
    user: userId,
  }).sort({
    isDefault: -1,
    createdAt: -1,
  });
}

export async function getAddressById(
  userId: string,
  addressId: string
) {
  return Address.findOne({
    _id: addressId,
    user: userId,
  });
}

export async function createAddress(
  userId: string,
  data: {
    title: string;
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
    plaque?: string;
    unit?: string;
    description?: string;
    isDefault?: boolean;
  }
) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);

    if (!user) {
      throw new Error("کاربر پیدا نشد");
    }

    const addressCount = await Address.countDocuments({
      user: userId,
    }).session(session);

    const shouldBeDefault =
      data.isDefault === true || addressCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany(
        {
          user: userId,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      ).session(session);
    }

    const [address] = await Address.create(
      [
        {
          ...data,
          user: userId,
          isDefault: shouldBeDefault,
        },
      ],
      {
        session,
      }
    );

    user.addresses.push(address._id);

    await user.save({ session });

    await session.commitTransaction();

    return address;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: Record<string, unknown>
) {
  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  });

  if (!address) {
    return null;
  }

  if (data.isDefault === true) {
    await Address.updateMany(
      {
        user: userId,
        _id: {
          $ne: addressId,
        },
      },
      {
        $set: {
          isDefault: false,
        },
      }
    );
  }

  Object.assign(address, data);

  await address.save();

  return address;
}

export async function deleteAddress(
  userId: string,
  addressId: string
) {
  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  });

  if (!address) {
    return null;
  }

  await Address.deleteOne({
    _id: addressId,
    user: userId,
  });

  await User.findByIdAndUpdate(userId, {
    $pull: {
      addresses: address._id,
    },
  });

  if (address.isDefault) {
    const anotherAddress = await Address.findOne({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    if (anotherAddress) {
      anotherAddress.isDefault = true;
      await anotherAddress.save();
    }
  }

  return true;
}