import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { cfg } from '../config/index.js';
import { isAuthorized } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song from YouTube')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('YouTube URL or search term')
      .setRequired(true)
  );

export const execute = async (interaction) => {
  console.log('====== PLAY COMMAND DEBUG ======');
  console.log('Play command executed by:', interaction.user.tag);
  console.log('Guild ID:', interaction.guildId);
  console.log('Query:', interaction.options.getString('query'));
  console.log('User in voice channel:', !!interaction.member?.voice?.channel);
  console.log('Voice channel name:', interaction.member?.voice?.channel?.name);
  console.log('Is authorized:', isAuthorized(interaction.member, cfg.uta.authorizedRoleId));

  // Authorization check
  if (!isAuthorized(interaction.member, cfg.uta.authorizedRoleId)) {
    console.log('Authorization failed - user not authorized');
    return interaction.reply({
      embeds: [createErrorEmbed("Only authorized DJs can play music!")],
      ephemeral: true
    });
  }

  // Voice channel check
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    console.log('Voice channel check failed - user not in voice channel');
    return interaction.reply({
      embeds: [createErrorEmbed("You need to be in a voice channel!")],
      ephemeral: true
    });
  }

  const query = interaction.options.getString('query');
  console.log('All checks passed, starting playback process...');

  await interaction.deferReply();

  try {
    // Check if node is available
    const nodeMap = interaction.client.shoukaku.nodes;
    let node = nodeMap.get(cfg.lavalink.name) || nodeMap.values().next().value;
    
    console.log('Node availability check:');
    console.log('- Node exists:', !!node);
    console.log('- Node name:', node?.name || 'undefined');
    console.log('- Node state:', node?.state || 'undefined');
    
    if (!node || node.state !== 2) {
      console.error('Node not ready for operations');
      return interaction.editReply({
        embeds: [createErrorEmbed("Music system is temporarily unavailable. Please try again in a moment.")]
      });
    }

    // Get or create player
    let player = interaction.client.shoukaku.players.get(interaction.guildId);
    
    if (!player) {
      try {
        console.log('Creating new player and joining voice channel...');
        console.log('Join parameters:', {
          guildId: interaction.guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild.shardId
        });
        
        player = await interaction.client.shoukaku.joinVoiceChannel({
          guildId: interaction.guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild.shardId
        });
        
        await player.setGlobalVolume(cfg.uta.defaultVolume);
        console.log('Successfully joined voice channel and set volume to:', cfg.uta.defaultVolume);
      } catch (error) {
        console.error('Failed to join voice channel:', error);
        return interaction.editReply({
          embeds: [createErrorEmbed("Couldn't join the voice channel! Check bot permissions.")]
        });
      }
    } else {
      console.log('Using existing player');
    }

    // Search for the track
    console.log(`Searching for track: ${query}`);
    
    // Add search prefix if it's not a URL
    const searchQuery = query.includes('http') ? query : `ytsearch:${query}`;
    console.log(`Final search query: ${searchQuery}`);
    
    const result = await searchWithTimeout(player.node, searchQuery, 30000);
    
    console.log(`Search result:`, {
      loadType: result?.loadType,
      trackCount: result?.tracks?.length || 0,
      playlistName: result?.playlistInfo?.name || 'N/A',
      exception: result?.exception?.message || 'none'
    });

    if (!result.tracks || result.tracks.length === 0) {
      console.log('No tracks found in search result');
      
      let errorMessage = `No results found for: ${query}`;
      if (result?.exception?.message) {
        errorMessage += `\nError: ${result.exception.message}`;
      }
      
      return interaction.editReply({
        embeds: [createErrorEmbed(errorMessage)]
      });
    }

    const track = result.tracks[0];
    console.log(`Selected track:`, {
      title: track.info?.title,
      author: track.info?.author,
      duration: track.info?.length,
      uri: track.info?.uri
    });

    // Play the track
    try {
      await player.playTrack({ track: track.encoded });
      console.log('Track playback started successfully');

      const successEmbed = createSuccessEmbed(track, voiceChannel.name);
      await interaction.editReply({ embeds: [successEmbed] });

    } catch (playError) {
      console.error('Failed to start track playback:', playError);
      return interaction.editReply({
        embeds: [createErrorEmbed(`Failed to start playback: ${playError.message}`)]
      });
    }

  } catch (error) {
    console.error('Play command execution error:', error);
    console.error('Error stack:', error.stack);
    
    await interaction.editReply({
      embeds: [createErrorEmbed(`An error occurred: ${error.message}`)]
    });
  }

  console.log('====== PLAY COMMAND COMPLETE ======');
};

// Enhanced search function with timeout
async function searchWithTimeout(node, query, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Search timed out after ${timeout/1000} seconds`));
    }, timeout);

    node.rest.resolve(query)
      .then(result => {
        clearTimeout(timeoutId);
        console.log(`Search completed for: ${query.substring(0, 50)}...`);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`Search failed for: ${query.substring(0, 50)}...`, error.message);
        reject(error);
      });
  });
}

function createSuccessEmbed(track, voiceChannelName) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Now Playing')
    .setDescription(`**${track.info.title}**\nby ${track.info.author}`)
    .addFields(
      { name: 'Duration', value: formatDuration(track.info.length), inline: true },
      { name: 'Voice Channel', value: voiceChannelName, inline: true },
      { name: 'Source', value: 'YouTube', inline: true }
    )
    .setThumbnail(track.info.artworkUrl || null)
    .setTimestamp();
}

function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Playback Error')
    .setDescription(message)
    .setTimestamp();
}

function formatDuration(ms) {
  if (!ms || ms < 0) return 'Live';
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
