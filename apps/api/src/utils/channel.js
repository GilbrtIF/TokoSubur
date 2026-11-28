/**
 * Penentuan kanal offline/online dari kolom channels.jenis.
 * Data v7 memakai 'toko fisik' (offline) dan 'marketplace' (online);
 * 'offline'/'online' tetap didukung untuk data lama/dummy.
 */
const OFFLINE_CHANNEL_TYPES = ['toko fisik', 'offline'];

const isOfflineChannel = (channel) =>
  OFFLINE_CHANNEL_TYPES.includes(
    String(channel && channel.jenis)
      .trim()
      .toLowerCase()
  );

const isOnlineChannel = (channel) => !isOfflineChannel(channel);

module.exports = {
  OFFLINE_CHANNEL_TYPES,
  isOfflineChannel,
  isOnlineChannel,
};
