// src/features/radio/interactions.js - UPDATED FOR DORMANT CONNECTION STRATEGY
import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { RADIO_CATEGORIES, RADIO_STATIONS } from '../../config/stations.js';
import { RadioUI } from './ui.js';

export class RadioInteractionHandler {
  constructor(client, radioManager, currentlyPlaying, updatePersistentMessage) {
    this.client = client;
    this.radioManager = radioManager;
    this.currentlyPlaying = currentlyPlaying;
    this.updatePersistentMessage = updatePersistentMessage;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.lastStationSwitch = new Map(); // Rate limiting
  }

  async handleCategorySelect(interaction) {
    const selectedCategory = interaction.values[0];
    const category = RADIO_CATEGORIES[selectedCategory];
    
    const stationOptions = category.stations
      .filter(stationKey => RADIO_STATIONS[stationKey])
      .map(stationKey => {
        const station = RADIO_STATIONS[stationKey];
        return {
          label: station.name,
          description: `${station.description} (${station.genre})`,
          value: stationKey
        };
      });

    const newStationSelect = new StringSelectMenuBuilder()
      .setCustomId('persistent_station_select')
      .setPlaceholder(`🎵 Choose from ${category.name}... (Auto-plays!)`)
      .addOptions(stationOptions)
      .setDisabled(false);

    const components = interaction.message.components.map((row, index) => {
      if (index === 1) {
        return new ActionRowBuilder().addComponents(newStationSelect);
      }
      return ActionRowBuilder.from(row);
    });

    await interaction.update({ components });
    interaction.message._selectedCategory = selectedCategory;
  }

  async handleStationSelect(interaction) {
    const selectedStation = interaction.values[0];
    const station = RADIO_STATIONS[selectedStation];
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '*"Please join a voice channel first so I can play music for you!"* 🎤',
        ephemeral: true
      });
    }

    // Check Lavalink status
    if (!this.client.shoukaku || !global.lavalinkReady) {
      return interaction.reply({
        content: '*"My audio system is starting up... please try again in a moment!"* ✨',
        ephemeral: true
      });
    }

    // Check for dormant connection that can be reactivated
    const connection = this.radioManager.persistentConnections.get(interaction.guildId);
    const isDormantReactivation = connection?.dormant && connection.currentStation === selectedStation;

    // Rate limiting check - but allow dormant reactivation without cooldown
    if (!isDormantReactivation) {
      const lastSwitch = this.lastStationSwitch.get(interaction.guildId);
      const now = Date.now();
      if (lastSwitch && (now - lastSwitch) < 3000) { // 3 second cooldown
        const waitTime = Math.ceil((3000 - (now - lastSwitch)) / 1000);
        return interaction.reply({
          content: `*"Please wait ${waitTime} more seconds before switching stations!"* ⏰`,
          ephemeral: true
        });
      }
    }

    // Update rate limiting (skip if dormant reactivation)
    if (!isDormantReactivation) {
      this.lastStationSwitch.set(interaction.guildId, Date.now());
    }

    // Different reply messages for dormant reactivation vs new station
    if (isDormantReactivation) {
      await interaction.reply({
        content: `🚀 *"Reactivating dormant connection to ${station.name}... This will be instant!"*`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `🎵 *"Switching to ${station.name}..."*`,
        ephemeral: true
      });
    }

    try {
      const startTime = Date.now();
      console.log(`🎵 ${isDormantReactivation ? 'Reactivating dormant' : 'Auto-playing'} ${selectedStation} for guild ${interaction.guildId}`);
      
      let result;
      
      if (isDormantReactivation) {
        // Use dormant reactivation method
        const reactivated = await this.radioManager.reactivateDormantConnection(
          interaction.guildId, 
          voiceChannel.id
        );
        
        if (reactivated) {
          result = { success: true, dormantReactivation: true };
        } else {
          // Fallback to normal switch if reactivation failed
          console.log('🔄 Dormant reactivation failed, falling back to normal switch');
          result = await this.radioManager.switchToStation(
            interaction.guildId, 
            selectedStation, 
            voiceChannel.id
          );
        }
      } else {
        // Use normal station switching method
        result = await this.radioManager.switchToStation(
          interaction.guildId, 
          selectedStation, 
          voiceChannel.id
        );
      }

      const endTime = Date.now();
      const switchTime = endTime - startTime;

      // Update our tracking
      this.currentlyPlaying.set(interaction.guildId, {
        stationKey: selectedStation,
        stationName: station.name,
        voiceChannelId: voiceChannel.id,
        startedAt: isDormantReactivation ? connection.created : Date.now() // Preserve original start time for dormant
      });

      // Create success message
      let successMessage;
      if (isDormantReactivation) {
        successMessage = `🚀 *"Dormant connection reactivated instantly!"* (${switchTime}ms)\n🎧 Resumed **${station.name}** in **${voiceChannel.name}**`;
      } else {
        successMessage = `🎵 *"Now playing ${station.name}!"* (Volume: ${this.defaultVolume}%)\n🎧 Playing in **${voiceChannel.name}**`;
      }

      await interaction.editReply({
        content: successMessage
      });

      // Update the main message to show current status
      await this.updatePersistentMessage();

      // Auto-delete success message after different times
      const deleteAfter = isDormantReactivation ? 2000 : 3000; // Shorter for instant dormant reactivation
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (err) {
          // Expected if message was already deleted
        }
      }, deleteAfter);

    } catch (error) {
      console.error('❌ Station switch/reactivation failed:', error);
      
      // Remove from tracking if failed
      this.currentlyPlaying.delete(interaction.guildId);
      
      let errorMessage = `*"Sorry, I couldn't ${isDormantReactivation ? 'reactivate' : 'play'} ${station.name}.*`;
      let deleteAfter = 5000;
      
      // Provide helpful error messages based on error type
      if (error.message.includes('cooling down')) {
        errorMessage += ` ${error.message}"*`;
        deleteAfter = 8000;
      } else if (error.message.includes('Already switching')) {
        errorMessage += ` I'm still switching stations, please wait!"*`;
      } else if (error.message.includes('No Lavalink nodes')) {
        errorMessage += ` My audio system needs a moment to reconnect. Please try again in 10 seconds!"* 🔄`;
        deleteAfter = 8000;
      } else if (error.message.includes('Guild not found') || error.message.includes('Voice channel not found')) {
        errorMessage += ` There was an issue with Discord. Please try again!"* 🔄`;
      } else {
        errorMessage += ` ${error.message}"*`;
      }
      
      await interaction.editReply({
        content: errorMessage
      });
      
      // Auto-delete error message
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (err) {
          // Expected if message was already deleted
        }
      }, deleteAfter);
    }
  }

  async handleStop(interaction) {
    // Check if connection is dormant
    const connection = this.radioManager.persistentConnections.get(interaction.guildId);
    const isDormant = connection?.dormant;
    
    if (isDormant) {
      await interaction.reply({
        content: '*"Destroying dormant connection... Your preserved music is being cleared!"* 💀',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '*"Stopping the music... Thank you for listening!"* 🎭',
        ephemeral: true
      });
    }

    try {
      // Complete cleanup for both active and dormant connections
      await this.radioManager.cleanupPersistentConnection(interaction.guildId);
      
      // Also clean up our tracking
      this.currentlyPlaying.delete(interaction.guildId);
      
      // Update main message
      await this.updatePersistentMessage();
      
      console.log(`✅ Successfully ${isDormant ? 'destroyed dormant connection' : 'stopped music'} for guild ${interaction.guildId}`);
      
    } catch (error) {
      console.error('❌ Error stopping music:', error.message);
    }

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (err) {
        // Expected if message was already deleted
      }
    }, 2000);
  }

  async handleStatus(interaction) {
    try {
      const status = await this.radioManager.getConnectionStatus(interaction.guildId);
      const embed = RadioUI.createStatusEmbed(interaction, this.currentlyPlaying, null, this.defaultVolume, status);
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Status command error:', error.message);
      await interaction.reply({
        content: '*"Sorry, I couldn\'t get the status information right now!"* ⚠️',
        ephemeral: true
      });
    }
  }

  async handle(interaction, persistentMessage) {
    try {
      // Only handle interactions for the persistent message
      if (!persistentMessage || interaction.message?.id !== persistentMessage.id) {
        return;
      }
      
      switch (interaction.customId) {
        case 'persistent_category_select':
          await this.handleCategorySelect(interaction);
          break;
        case 'persistent_station_select':
          await this.handleStationSelect(interaction);
          break;
        case 'persistent_stop':
          await this.handleStop(interaction);
          break;
        case 'persistent_status':
          await this.handleStatus(interaction);
          break;
        default:
          console.warn(`⚠️ Unknown interaction: ${interaction.customId}`);
      }
    } catch (error) {
      console.error('❌ Interaction handler error:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: '*"Something went wrong... please try again!"* ⚠️',
            ephemeral: true
          });
        } catch (replyError) {
          console.error('❌ Failed to send error reply:', replyError.message);
        }
      }
    }
  }
}
