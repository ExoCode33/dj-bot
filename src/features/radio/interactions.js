// src/features/radio/interactions.js
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

    if (!this.client.shoukaku || !global.lavalinkReady) {
      return interaction.reply({
        content: '*"My audio system isn\'t ready yet... please try again in a moment!"* ✨',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `🎵 *"Switching to ${station.name}..."*`,
      ephemeral: true
    });

    try {
      console.log(`🎵 Auto-playing ${selectedStation} for guild ${interaction.guildId}`);
      
      // Use the radio manager to switch stations
      const result = await this.radioManager.switchToStation(
        interaction.guildId, 
        selectedStation, 
        voiceChannel.id
      );

      // Update our tracking
      this.currentlyPlaying.set(interaction.guildId, {
        stationKey: selectedStation,
        stationName: station.name,
        voiceChannelId: voiceChannel.id,
        startedAt: Date.now()
      });

      await interaction.editReply({
        content: `🎵 *"Now playing ${station.name}!"* (Volume: ${this.defaultVolume}%)\n🎧 Playing in **${voiceChannel.name}**`
      });

      // Update the main message to show current status
      await this.updatePersistentMessage();

      // Auto-delete success message after 4 seconds
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (err) {}
      }, 4000);

    } catch (error) {
      console.error('❌ Auto-play failed:', error);
      
      // Remove from tracking if failed
      this.currentlyPlaying.delete(interaction.guildId);
      
      await interaction.editReply({
        content: `*"Sorry, I couldn't play ${station.name}. ${error.message}"*`
      });
      
      // Auto-delete error after 6 seconds
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (err) {}
      }, 6000);
    }
  }

  async handleStop(interaction) {
    await interaction.reply({
      content: '*"Stopping the music... Thank you for listening!"* 🎭',
      ephemeral: true
    });

    const player = this.client.shoukaku.players.get(interaction.guildId);
    
    if (player) {
      try {
        await player.stopTrack();
        await player.destroy();
        this.client.shoukaku.players.delete(interaction.guildId);
      } catch (error) {
        this.client.shoukaku.players.delete(interaction.guildId);
      }
    }

    this.currentlyPlaying.delete(interaction.guildId);
    await this.updatePersistentMessage();

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (err) {}
    }, 3000);
  }

  async handleStatus(interaction) {
    const player = this.client.shoukaku.players.get(interaction.guildId);
    const embed = RadioUI.createStatusEmbed(interaction, this.currentlyPlaying, player, this.defaultVolume);
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  async handle(interaction, persistentMessage) {
    try {
      if (!persistentMessage || interaction.message?.id !== persistentMessage.id) return;
      
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
      }
    } catch (error) {
      console.error('❌ Interaction error:', error);
    }
  }
}
