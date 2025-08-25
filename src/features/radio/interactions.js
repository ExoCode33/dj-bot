// src/features/radio/interactions.js - UPDATED FOR PERSISTENT CONNECTION STRATEGY
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
        content: '*"My audio system is starting up... please try again in a moment!"*
