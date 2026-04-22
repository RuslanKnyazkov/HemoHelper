# serializers.py - упрощенная версия
from rest_framework import serializers
from .models import RocheAnalyzer, RocheModule, Reagent, ModuleReagent


class ReagentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reagent
        fields = ['id', 'name', 'code',
                  'short_name', 'category', 'description']


class ModuleReagentSerializer(serializers.ModelSerializer):
    reagent = ReagentSerializer(read_only=True)

    class Meta:
        model = ModuleReagent
        fields = ['id', 'module', 'reagent', 'channel', 'is_active']


class RocheModuleSerializer(serializers.ModelSerializer):
    reagents = ModuleReagentSerializer(many=True, read_only=True)
    module_type_display = serializers.CharField(
        source='get_module_type_display', read_only=True)
    has_channels = serializers.BooleanField(read_only=True)

    class Meta:
        model = RocheModule
        fields = ['id', 'module_type', 'module_type_display',
                  'module_number', 'name', 'position', 'has_channels', 'reagents']


class RocheAnalyzerSerializer(serializers.ModelSerializer):
    modules = RocheModuleSerializer(many=True, read_only=True)

    class Meta:
        model = RocheAnalyzer
        fields = ['id', 'name', 'code', 'is_active', 'modules']
